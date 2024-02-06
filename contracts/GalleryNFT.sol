// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {ERC721A} from "erc721a/contracts/ERC721A.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract GalleryNFT is ERC721A, Ownable {
    struct Model {
        uint256 maxSupply;
        uint256 supply;
        uint256 price;
        string uri;
    }

    error ModelAlreadyExists(uint256 id);
    error ModelDoesNotExist(uint256 id);
    error InsufficientSupply(uint256 modelId, uint256 currentSupply, uint256 amountRequested);
    error InsufficientMsgValue(uint256 requiredValue, uint256 valueProvided);
    error MintReentrancy();

    // mapping from model id to its corresponding model
    mapping(uint256 => Model) private _model;
    // mapping from each tokenId to a modelId
    mapping(uint256 => uint256) private _tokenModelId;

    constructor(address _initialOwner) ERC721A("GalleryNFT", "GNFT") Ownable(_initialOwner) {}

    /**
     * @dev A Method for owner to create a new NFT Model
     * @param modelId The id of the model to be created
     * @param modelMaxSupply The max supply for the new model
     * @param modelUri The metadata uri for all tokens minted using this model
     */
    function setUpModel(
        uint256 modelId,
        uint256 modelMaxSupply,
        uint256 price,
        string memory modelUri
    ) public onlyOwner {
        if (!_modelMissing(modelId)) revert ModelAlreadyExists(modelId);
        _model[modelId] = Model({
            maxSupply: modelMaxSupply,
            supply: 0,
            price: price,
            uri: modelUri
        });
    }

    /**
     * @dev A method for the owner to withdraw the funds
     */
    function withdrawFunds() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev A method to mint up to several NFTs from a single model
     * @param modelId The id of the model to be minted into an NFT
     * @param amount The amount to be minted
     */
    function mint(uint256 modelId, uint256 amount) public payable {
        if (!_modelExists(modelId)) revert ModelDoesNotExist(modelId);
        if (!_modelHasSupply(modelId, amount))
            revert InsufficientSupply(modelId, _model[modelId].supply, amount);
        if (msg.value < _model[modelId].price * amount)
            revert InsufficientMsgValue(_model[modelId].price, msg.value);

        _safeMint(msg.sender, amount);
        // set the model id used for each token
        unchecked {
            uint256 end = _nextTokenId();
            uint256 index = end - amount;
            _model[modelId].supply += amount;
            do {
                _tokenModelId[index] = modelId;
                index++;
            } while (index < end);
            // Reentrancy protection.
            if (_nextTokenId() != end) revert MintReentrancy();
        }
    }

    /**
     * @dev Override the ERC721A tokenURI method to use the model's
     * @param tokenId The id of the token
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

        return _model[_tokenModelId[tokenId]].uri;
    }

    /**
     * @dev A method to get a specific model
     * @param modelId The id of the model to get
     */
    function getModel(uint256 modelId) public view returns (Model memory) {
        if (!_modelExists(modelId)) revert ModelDoesNotExist(modelId);
        return _model[modelId];
    }

    /**
     * @dev A private method to check wether a specific model exists
     * @param modelId The id of the model being checked
     */
    function _modelExists(uint256 modelId) private view returns (bool) {
        return (modelId != 0 &&
            _model[modelId].maxSupply > 0 &&
            bytes(_model[modelId].uri).length > 0);
    }

    /**
     * @dev A private method to check wether a specific model is missing (can be created)
     * @param modelId The id of the model being checked
     */
    function _modelMissing(uint256 modelId) private view returns (bool) {
        return (modelId != 0 &&
            _model[modelId].maxSupply == 0 &&
            bytes(_model[modelId].uri).length == 0);
    }

    /**
     * @dev A private method to check wether a specific model still has enough supply
     * @param modelId The id of the model being checked
     * @param amount  The supply amount requested
     */
    function _modelHasSupply(uint256 modelId, uint256 amount) private view returns (bool) {
        return (_model[modelId].supply + amount <= _model[modelId].maxSupply);
    }
}
